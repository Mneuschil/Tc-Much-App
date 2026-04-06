/**
 * Creates a FormData entry for file uploads in React Native.
 * Uses the `as unknown as Blob` workaround required by React Native's FormData.
 */
export function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  fileName: string,
  mimeType: string,
): void {
  formData.append(fieldName, {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
}
