
import { renderHook, act } from '@testing-library/react';
import { useCamera } from '../hooks/useCamera';

describe('useCamera', () => {
  beforeAll(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getDisplayMedia: jest.fn().mockResolvedValue({
          getVideoTracks: () => [{ stop: jest.fn(), onended: null }],
          getTracks: () => [{ stop: jest.fn() }],
        }),
        getUserMedia: jest.fn().mockResolvedValue({
          getVideoTracks: () => [{ enabled: true }],
          getAudioTracks: () => [{ enabled: true }],
          getTracks: () => [{ stop: jest.fn() }],
        }),
        enumerateDevices: jest.fn().mockResolvedValue([]),
      },
      writable: true,
    });
  });

  it('should return an error when trying to toggle camera while screen sharing', async () => {
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startStream();
      await result.current.startScreenShare(() => {});
    });

    act(() => {
      result.current.toggleCamera();
    });

    expect(result.current.error).toBe('Cannot toggle camera while screen sharing.');
  });
});
