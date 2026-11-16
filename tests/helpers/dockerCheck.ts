import { getContainerRuntimeClient } from 'testcontainers';

export async function isDockerAvailable(): Promise<boolean> {
  try {
    await getContainerRuntimeClient();
    return true;
  } catch {
    return false;
  }
}
