import type { CollectionAfterReadHook } from 'payload'
import { User } from 'src/payload-types'

export const populateAuthors: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  if (!doc?.authors || !Array.isArray(doc.authors)) {
    return doc;
  }

  const authorDocs: User[] = [];

  for (const author of doc.authors) {
    const authorId = typeof author === 'object' ? author?.id : author;
    
    if (!authorId) {
      console.warn('⚠️ Author ID is missing or invalid:', author);
      continue; // Bỏ qua tác giả nếu không có ID hợp lệ
    }
  
    try {
      const authorDoc = await payload.findByID({
        collection: 'users',
        id: authorId,
        depth: 0,
      });

      if (authorDoc) {
        authorDocs.push(authorDoc); // Lưu vào danh sách tác giả hợp lệ
      } else {
        console.warn(`⚠️ Author with ID ${authorId} not found.`);
      }

    } catch (error) {
      console.error('❌ Error fetching author:', error);
    }
  }

  return { ...doc, populatedAuthors: authorDocs };
};
