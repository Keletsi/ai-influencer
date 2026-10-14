import { describe, it, expect } from 'vitest';
import {
  openRouterApi,
  MOTION_TRANSFER_MODEL,
  POLICY_BLOCK_RETRY_MODELS,
  DEFAULT_DURATION_SECONDS,
  buildMotionTransferPrompt,
  isPolicyBlock,
  isMediaCountFailure,
  unsignedUrlToProxyTarget,
} from '../services/openrouter';

describe('OpenRouter service', () => {
  it('exposes the generation methods', () => {
    expect(openRouterApi).toHaveProperty('createMotionTransfer');
    expect(openRouterApi).toHaveProperty('getJob');
    expect(openRouterApi).toHaveProperty('waitForCompletion');
    expect(openRouterApi).toHaveProperty('listModels');
    expect(openRouterApi).toHaveProperty('resolveModel');
    expect(openRouterApi).toHaveProperty('isConfigured');
  });

  it('pins motion transfer to a video-reference capable model', () => {
    // Only BytePlus Seedance 2.x honors video input references; other
    // providers ignore them and would generate motion of their own.
    expect(MOTION_TRANSFER_MODEL).toMatch(/seedance/);
  });

  it('defaults to a 10 second clip', () => {
    expect(DEFAULT_DURATION_SECONDS).toBe(10);
    // Seedance 2.0 supports 4-15s, so the default must be in range
    expect(DEFAULT_DURATION_SECONDS).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_DURATION_SECONDS).toBeLessThanOrEqual(15);
  });

  it('offers non-Seedance vendors for policy-block retries', () => {
    // Retrying a real-person block on another Seedance variant would fail
    // the same way; the retry list must be different vendors.
    expect(POLICY_BLOCK_RETRY_MODELS.length).toBeGreaterThan(0);
    for (const model of POLICY_BLOCK_RETRY_MODELS) {
      expect(model).not.toMatch(/seedance/);
    }
  });
});

describe('Policy block detection', () => {
  it('recognizes the real-person filter rejection', () => {
    expect(
      isPolicyBlock(
        new Error(
          'HTTP 400: {"error":{"code":"InputImageSensitiveContentDetected.PrivacyInformation","message":"the input image may contain real person"}}'
        )
      )
    ).toBe(true);
  });

  it('recognizes moderation rejections', () => {
    expect(isPolicyBlock(new Error('content policy violation'))).toBe(true);
  });

  it('does not treat key or network errors as policy blocks', () => {
    expect(isPolicyBlock(new Error('Missing Authentication header'))).toBe(false);
    expect(isPolicyBlock(new Error('Could not reach the app server'))).toBe(false);
    expect(isPolicyBlock(new Error('rate limited'))).toBe(false);
  });
});

describe('Media count failure detection', () => {
  it('recognizes the reference limit rejection', () => {
    expect(
      isMediaCountFailure(
        new Error('Media array is too long, a maximum of 5 items are required')
      )
    ).toBe(true);
  });

  it('does not treat other failures as media count issues', () => {
    expect(isMediaCountFailure(new Error('Missing Authentication header'))).toBe(false);
    expect(isMediaCountFailure(new Error('Video generation failed'))).toBe(false);
    expect(isMediaCountFailure(undefined)).toBe(false);
  });
});

describe('Motion transfer prompt', () => {
  const files = {
    imageFile: new File(['x'], 'a.png', { type: 'image/png' }),
    videoFile: new File(['x'], 'b.mp4', { type: 'video/mp4' }),
  };

  it('references the avatar image and the driver video', () => {
    const prompt = buildMotionTransferPrompt(files);

    expect(prompt).toContain('image 1');
    expect(prompt).toContain('video 1');
  });

  it('describes sampled frames instead of a video in frame mode', () => {
    const prompt = buildMotionTransferPrompt(files, 'frame-reference');
    const lower = prompt.toLowerCase();

    // "video 1" does not exist in this mode, so referring to it would mislead
    expect(lower).not.toContain('video 1');
    expect(lower).toContain('frames');
    expect(lower).toContain('interpolate');
  });

  it('leads with the user prompt so their instruction wins', () => {
    const prompt = buildMotionTransferPrompt({
      ...files,
      prompt: 'the avatar waves at the camera',
    });

    expect(prompt.startsWith('the avatar waves at the camera')).toBe(true);
  });

  it('works with no user prompt supplied', () => {
    const prompt = buildMotionTransferPrompt(files);
    expect(prompt).toContain('Transfer the motion');
  });

  it('appends the negative prompt when provided', () => {
    const prompt = buildMotionTransferPrompt({
      ...files,
      negativePrompt: 'blur, distortion',
    });

    expect(prompt).toContain('blur, distortion');
  });

  it('varies wording by match mode', () => {
    const structure = buildMotionTransferPrompt({ ...files, matchMode: 'structure' });
    const motion = buildMotionTransferPrompt({ ...files, matchMode: 'motion' });

    expect(structure).not.toEqual(motion);
  });

  it('varies wording by motion strength', () => {
    const low = buildMotionTransferPrompt({ ...files, motionStrength: 20 });
    const high = buildMotionTransferPrompt({ ...files, motionStrength: 90 });

    expect(low).not.toEqual(high);
  });
});

describe('Unsigned content URL mapping', () => {
  it('strips the origin and api/v1 prefix but keeps the query', () => {
    expect(
      unsignedUrlToProxyTarget(
        'https://openrouter.ai/api/v1/videos/gen-vid-abc123/content?index=0'
      )
    ).toEqual({ path: 'videos/gen-vid-abc123/content', query: 'index=0' });
  });

  it('handles bare paths without origin, prefix, or query', () => {
    expect(unsignedUrlToProxyTarget('videos/abc/content')).toEqual({
      path: 'videos/abc/content',
      query: '',
    });
    expect(unsignedUrlToProxyTarget('/api/v1/videos/abc/content')).toEqual({
      path: 'videos/abc/content',
      query: '',
    });
  });

  it('never produces a doubled api/v1 prefix', () => {
    const { path } = unsignedUrlToProxyTarget(
      'https://openrouter.ai/api/v1/videos/abc/content'
    );
    expect(path.startsWith('api/')).toBe(false);
    expect(path).toBe('videos/abc/content');
  });
});