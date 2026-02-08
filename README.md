# fiziomidia
# Fiziomidia - Backend skeleton

## Setup (local dev)
`npm install`
Ensure MongoDB running and MONGO_URI set.
`npm run dev` to start with nodemon.

## Sub Permissions
| Action                             | Owner | Mod | Sub_Mod |
| ---------------------------------- | ----- | --- | ------- |
| Delete sub                         | ❌     | ❌   | ❌       |
| Edit sub (title/description/rules) | ✅     | ✅   | ❌       |
| Manage sponsorship                 | ❌     | ❌   | ❌       |
| Approve/reject sub_mod requests    | ✅     | ✅   | ❌       |
| Moderate posts/comments            | ✅     | ✅   | ✅       |
| Add/remove moderators              | ✅     | ❌   | ❌       |
| Pin/unpin posts (optional)         | ✅     | ✅   | ❌      |
| Manage rules                       | ✅     | ✅   | ❌      |

Test
1. register for domain
2. MongoDb cruster ✅
3. backend to Render ✅ 
4. frontend to Netlify ✅ has limitation
5. Cloudflare