import { cn } from '@/lib/utils';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

const H1 = ({ children, className }: TypographyProps) => (
  <h1 className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl", className)}>
    {children}
  </h1>
);

const H2 = ({ children, className }: TypographyProps) => (
  <h2 className={cn("scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0", className)}>
    {children}
  </h2>
);

const H3 = ({ children, className }: TypographyProps) => (
  <h3 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", className)}>
    {children}
  </h3>
);

const H4 = ({ children, className }: TypographyProps) => (
  <h4 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)}>
    {children}
  </h4>
);

const P = ({ children, className }: TypographyProps) => (
  <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}>
    {children}
  </p>
);

const Lead = ({ children, className }: TypographyProps) => (
  <p className={cn("text-xl text-muted-foreground", className)}>
    {children}
  </p>
);

const Large = ({ children, className }: TypographyProps) => (
  <div className={cn("text-lg font-semibold", className)}>
    {children}
  </div>
);

const Small = ({ children, className }: TypographyProps) => (
  <small className={cn("text-sm font-medium leading-none", className)}>
    {children}
  </small>
);

const Muted = ({ children, className }: TypographyProps) => (
  <p className={cn("text-sm text-muted-foreground", className)}>
    {children}
  </p>
);

const Blockquote = ({ children, className }: TypographyProps) => (
  <blockquote className={cn("mt-6 border-l-2 border-muted pl-6 italic", className)}>
    {children}
  </blockquote>
);

const List = ({ children, className }: TypographyProps) => (
  <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
    {children}
  </ul>
);

const InlineCode = ({ children, className }: TypographyProps) => (
  <code className={cn("relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", className)}>
    {children}
  </code>
);

export {
  H1,
  H2,
  H3,
  H4,
  P,
  Lead,
  Large,
  Small,
  Muted,
  Blockquote,
  List,
  InlineCode
}