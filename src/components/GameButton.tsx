import { Button, type ButtonProps } from "@/components/ui/button";

export function GameButton(props: ButtonProps) {
  return <Button variant="game" size="game" {...props} />;
}