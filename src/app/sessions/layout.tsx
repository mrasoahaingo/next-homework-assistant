export default function SessionsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className='mx-auto w-[800px] p-16'>{children}</div>;
}
