declare module "react-native-barcode-creator" {
  import React from "react";
  import { ViewStyle } from "react-native";

  interface BarcodeCreatorProps {
    value: string;
    format: any; // Format constant
    style?: ViewStyle;
    background?: string;
    foregroundColor?: string;
  }

  export const BarcodeCreatorView: React.FC<BarcodeCreatorProps>;

  export const BarcodeFormat: {
    AZTEC: any;
    CODE128: any;
    PDF417: any;
    QR: any;
    EAN13: any;
    UPCA: any;
  };
}
