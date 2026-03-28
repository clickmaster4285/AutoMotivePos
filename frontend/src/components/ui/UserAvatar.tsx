import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type UserLike = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

const sizeClass = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-lg",
};

export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user: UserLike;
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  const a = (user.firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
  const b = (user.lastName?.[0] ?? "").toUpperCase();
  const fallback = `${a}${b}`.trim() || "?";

  return (
    <Avatar className={cn(sizeClass[size], className)}>
      <AvatarFallback className="bg-primary/15 text-primary font-semibold font-mono">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}
