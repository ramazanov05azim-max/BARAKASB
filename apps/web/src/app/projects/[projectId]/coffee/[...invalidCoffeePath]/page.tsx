import { CoffeeNotFoundScreen } from '@barakasb/solution-coffee';
import { redirect } from 'next/navigation';

export function resolveRemovedCoffeeHubRedirect(
  projectId: string,
  invalidCoffeePath: string[],
): string | null {
  if (invalidCoffeePath.length !== 1) return null;
  if (invalidCoffeePath[0] === 'menu') {
    return `/projects/${projectId}/coffee/menu/categories`;
  }
  if (invalidCoffeePath[0] === 'inventory') {
    return `/projects/${projectId}/coffee/inventory/ingredients`;
  }
  return null;
}

export default async function InvalidCoffeeRoutePage({
  params,
}: {
  params: Promise<{ projectId: string; invalidCoffeePath: string[] }>;
}) {
  const { projectId, invalidCoffeePath } = await params;
  const destination = resolveRemovedCoffeeHubRedirect(projectId, invalidCoffeePath);
  if (destination) redirect(destination);
  return <CoffeeNotFoundScreen />;
}
