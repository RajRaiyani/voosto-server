import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import withDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';

import { 
  ValidationSchema as CreatePostSchema, 
  Controller as CreatePostController 
} from '@/modules/post/createPost.js';

import { 
  ValidationSchema as DeletePostSchema, 
  Controller as DeletePostController 
} from '@/modules/post/deletePost.js';

import { 
  ValidationSchema as ListPostsSchema, 
  Controller as ListPostsController 
} from '@/modules/post/listPosts.js';

import { 
  ValidationSchema as GetPostSchema, 
  Controller as GetPostController 
} from '@/modules/post/getPost.js';

const router = express.Router();

router.route('/')
  .post(
    isUserLoggedIn, 
    validate(CreatePostSchema), 
    withDatabase(CreatePostController)
  )
  .get(
    isUserLoggedIn,
    validate(ListPostsSchema),
    withDatabase(ListPostsController)
  );

router.route('/:post_id')
  .get(
    isUserLoggedIn,
    validate(GetPostSchema),
    withDatabase(GetPostController)
  )
  .delete(
    isUserLoggedIn,
    validate(DeletePostSchema),
    withDatabase(DeletePostController)
  );

export default router;