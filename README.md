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
1. registered for domain
2. MongoDb cruster
3. backend to Render
4. Front end Cloudflare
5. Image on Cloudinary
6. GMAIL stmp to send mail
7. ImproveMX to receive email


