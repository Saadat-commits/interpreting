import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { navigate } from "../router";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function Link({ href, onClick, ...rest }: Props) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}
