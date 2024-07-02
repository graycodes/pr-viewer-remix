const buttonStyles =
  "bg-violet-400 p-[2px] px-2 text-white text-center shadow hover:bg-violet-300";

export const Link = <
  T extends { className?: string; children: React.ReactNode }
>(
  props: T
) => (
  <a {...props} className={buttonStyles + " " + props.className}>
    {props.children}
  </a>
);
export const Button = <
  T extends { className?: string; children: React.ReactNode }
>(
  props: T
) => <button {...props} className={buttonStyles + " " + props.className} />;

export const A: React.FC<{
  className?: string;
  children: React.ReactNode;
  href: string;
  onClick?: () => void;
  title?: string;
}> = (props) => (
  <a
    {...props}
    title={props.title}
    target="_blank"
    rel="noreferrer"
    className={
      "font-bold underline hover:text-violet-500 hover:no-underline " +
      (props.className || "")
    }
  >
    {props.children}
  </a>
);
