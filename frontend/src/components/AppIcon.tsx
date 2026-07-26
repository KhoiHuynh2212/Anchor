import React from "react";
import { Ionicons } from "@expo/vector-icons";

type AppIconProps = React.ComponentProps<typeof Ionicons>;

export default function AppIcon({ size = 20, ...props }: AppIconProps) {
  return <Ionicons size={size} {...props} />;
}
