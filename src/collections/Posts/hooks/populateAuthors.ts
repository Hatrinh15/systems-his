import type { CollectionAfterReadHook } from 'payload'
import { User } from 'src/payload-types'

// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the authors manually here to protect user privacy
// GraphQL will not return mutated user data that differs from the underlying schema
// So we use an alternative `populatedAuthors` field to populate the user data, hidden from the admin UI
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  if (doc?.authors) {
    const authorDocs: User[] = []

    for (const author of doc.authors) {
      const authorId = typeof author === 'object' ? author?.id : author;
      
      if (!authorId) {
        console.warn('Author ID is missing or invalid:', author);
        continue; // Bỏ qua tác giả nếu không có ID hợp lệ
      }
    
      try {
        const authorDoc = await payload.findByID({
          id: authorId,
          collection: 'users',
          depth: 0,
        });
      
        // Kiểm tra nếu không tìm thấy tác giả
        if (!authorDoc) {
          throw new Error(`Author with ID ${authorId} not found.`);
        }
      
        // Nếu tìm thấy tác giả, thực hiện các thao tác tiếp theo
        return authorDoc;
      
      } catch (error) {
        console.error('Error fetching author:', error);
        
        // Tùy vào cách bạn muốn xử lý: trả về null hoặc một giá trị mặc định
        return null; 
      }
    }

  return doc
} }
