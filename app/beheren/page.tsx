import Beginscherm from './Beginscherm';
import Login from './Login';
import { headers } from 'next/headers';
import { geldigeSessie } from '@/app/lib/auth';

export default async function BeheerPagina() {
  const request = new Request('https://local' , { headers: await headers() });
  return await geldigeSessie(request) ? <Beginscherm /> : <Login />;
}
