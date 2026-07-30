import { redirect } from 'next/navigation';

export default function CreateCoffeeProjectPage() {
  redirect('/projects/new?category=food&solution=coffee');
}
