import type { DocumentPickerAsset } from "expo-document-picker";

// expo-file-system isn't available on web; the picker hands back a browser File.
export async function readPickedFile(asset: DocumentPickerAsset): Promise<string> {
  if (asset.file) return asset.file.text();
  return (await fetch(asset.uri)).text();
}
