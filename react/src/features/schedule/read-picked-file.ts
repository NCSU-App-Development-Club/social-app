import type { DocumentPickerAsset } from "expo-document-picker";
import { File } from "expo-file-system";

export async function readPickedFile(asset: DocumentPickerAsset): Promise<string> {
  return new File(asset.uri).text();
}
