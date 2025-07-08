export interface ParsedFile {
  content: string;
  filename: string;
}

export const parseFile = async (file: File): Promise<ParsedFile> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to parse file');
  }

  return response.json();
};

export const validateFile = (file: File): string | null => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedExtensions = ['.txt', '.doc', '.docx', '.rtf', '.pdf', '.html', '.htm', '.md'];
  const allowedTypes = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/rtf',
    'text/rtf',
    'application/pdf',
    'text/html',
    'text/markdown'
  ];

  if (file.size > maxSize) {
    return 'File size must be less than 10MB';
  }

  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidExtension = allowedExtensions.includes(fileExtension);
  const isValidType = allowedTypes.includes(file.type);

  if (!isValidExtension && !isValidType) {
    return 'Supported formats: .txt, .doc, .docx, .rtf, .pdf, .html, .htm, .md';
  }

  return null;
};
