import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v7 as uuidv7 } from 'uuid';
import Database from '@/service/database/index.js';
import { registerNewFile } from '@/modules/file/file.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDirectory = path.join(__dirname, '../../tmp/files');

if (fs.existsSync(uploadDirectory)) {
  fs.rmSync(uploadDirectory, { recursive: true });
}
fs.mkdirSync(uploadDirectory, { recursive: true });

function readCsvFile(filePath: string) {
  return new Promise<any[]>((resolve) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data: any) => results.push(data))
      .on('end', () => resolve(results));
  });
}

function generateFileId(filepath: string) {
  if (!fs.existsSync(filepath)) return null;
  const newFilePath = path.join(uploadDirectory, uuidv7() + path.extname(filepath));
  fs.copyFileSync(filepath, newFilePath);
  return newFilePath;
}



async function uploadUsers() {
  let users = await readCsvFile(path.join(__dirname, '../../tmp/userData.csv'));
  users = users.map((user) => {

    const [month, day, year] = user.date_of_birth.split('/');

    return {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password_hash: '$2b$07$ld3otBu3bsxG7ICLIldQ8OYfFkhgYzt1vPXavb3tLbKRFg9fVtNOS',
      gender: user.gender,
      country_code: user.country_code,
      bio: user.bio,
      latitude: Number(user.latitude),
      longitude: Number(user.longitude),
      date_of_birth: `${year}-${month}-${day}`,
      profile_image: generateFileId(path.join(__dirname, '../../tmp/images', user.first_name.toLowerCase() + '.jpeg')),
    };
  });

  // console.log(users.filter((user) => user.profile_image === null).map((user) => user.first_name + ' -> ' + user.email));
  console.log(users);
  


  for (const user of users) {

    const db = await Database.getConnection();
    try {
      await db.begin();
      let profileImageId = null;
      if (user.profile_image) {
        const newFile = await registerNewFile({ database:db }, { filePath: user.profile_image });
        profileImageId = newFile.id;
      }

      await db.namedQueryOne(`
        INSERT INTO users (
          first_name, 
          last_name, 
          email, 
          password_hash, 
          gender, 
          country_id, 
          bio, 
          latitude, 
          longitude, 
          date_of_birth, 
          profile_image_id,
          is_profile_completed,
          is_email_verified,
          is_fake_user
        )
        VALUES (
          $first_name, 
          $last_name, 
          $email, 
          $password_hash, 
          $gender, 
          (SELECT id FROM countries WHERE code = $country_code),
          $bio, 
          $latitude, 
          $longitude, 
          $date_of_birth, 
          $profile_image_id,
          true,
          true,
          true
        )
        RETURNING *
      `, {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        password_hash: user.password_hash,
        gender: user.gender,
        country_code: user.country_code,
        bio: user.bio,
        latitude: user.latitude,
        longitude: user.longitude,
        date_of_birth: user.date_of_birth,
        profile_image_id: profileImageId,
      });
      await db.commit();
      console.log('Uploaded user: ' + user.email);

    } catch (error) {
      await db.rollback();
      console.error(error.message + ' -> ' + user.email);
    } finally {
      db.release();
    }
  }
}

uploadUsers();