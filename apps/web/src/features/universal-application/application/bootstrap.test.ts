import { describe, expect, it } from 'vitest';
import { LocalApplicationBootstrapController } from './bootstrap';

describe('LocalApplicationBootstrapController', () => {
  it('starts in the starting state', () => {
    const controller = new LocalApplicationBootstrapController();
    expect(controller.getSnapshot()).toEqual({ state: 'starting' });
  });

  it('moves to requires-environment-code after start', async () => {
    const controller = new LocalApplicationBootstrapController();
    await controller.start();
    expect(controller.getSnapshot()).toEqual({
      state: 'requires-environment-code',
    });
  });

  it('is idempotent when start is called repeatedly', async () => {
    const controller = new LocalApplicationBootstrapController();
    await controller.start();
    const firstSnapshot = controller.getSnapshot();
    await controller.start();
    expect(controller.getSnapshot()).toBe(firstSnapshot);
  });

  it('does not create environment, device, employee session, or runtime state', async () => {
    const controller = new LocalApplicationBootstrapController();
    await controller.start();
    const snapshot = controller.getSnapshot();

    expect(snapshot).toEqual({ state: 'requires-environment-code' });
    expect(Object.keys(snapshot)).toEqual(['state']);
  });
});
