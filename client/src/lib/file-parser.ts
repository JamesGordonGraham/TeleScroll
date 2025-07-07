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
  const allowedTypes = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (file.size > maxSize) {
    return 'File size must be less than 10MB';
  }

  if (!allowedTypes.includes(file.mimetype) && !file.name.endsWith('.txt') && !file.name.endsWith('.docx')) {
    return 'Only .txt and .docx files are supported';
  }

  return null;
};
