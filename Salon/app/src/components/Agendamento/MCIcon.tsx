import React from "react";
import { IconProps } from "react-native-vector-icons/Icon";
import MaterialCommunityIconsImport from "react-native-vector-icons/MaterialCommunityIcons";

// Força o tipo correto para uso com JSX
const MaterialCommunityIcons = MaterialCommunityIconsImport as unknown as React.ComponentType<IconProps>;

export default MaterialCommunityIcons;
