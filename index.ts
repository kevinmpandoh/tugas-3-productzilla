// index.ts
import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

const logFolder = "log";

// Fungsi logging untuk mencatat ke dalam file log
const logToFile = async (message: string) => {
  // Pastikan folder logging ada
  await fs.mkdir(logFolder, { recursive: true });

  // Mendapatkan waktu sekarang
  const now = new Date();
  const timestamp = `${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}_${
    now.getMonth() + 1
  }_${now.getDate()}_${now.getFullYear()}`;

  // Menentukan nama file log berdasarkan timestamp
  const logFileName = path.join(logFolder, `${timestamp}.log`);

  const logMessage = `${new Date().toISOString()} - ${message}\n`;
  await fs.appendFile(logFileName, logMessage, "utf-8");
};

// Fungsi untuk membuat kunci enkripsi dari password
const generateKey = (password: string) => {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("base64")
    .substr(0, 32);
};

// Fungsi untuk memeriksa keberadaan file
const checkFileExists = async (filePath: string) => {
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error("File tidak ditemukan");
  }
};

const encryptFile = async (filePath: string, password: string) => {
  try {
    await checkFileExists(filePath); // Validasi file sebelum mengenkripsi
    await logToFile(`Mulai mengenkripsi file ${filePath}`);

    const fileData = await fs.readFile(filePath);
    const iv = crypto.randomBytes(16); // initialization vector
    const key = generateKey(password);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const encrypted = Buffer.concat([cipher.update(fileData), cipher.final()]);

    const encryptedFilePath = path.join(
      path.dirname(filePath),
      path.basename(filePath, path.extname(filePath)) + "_encrypted.txt"
    );
    await fs.writeFile(encryptedFilePath, Buffer.concat([iv, encrypted]));

    // Hapus file asli
    await fs.unlink(filePath);

    console.log(
      `File '${path.basename(
        filePath
      )}' berhasil dienkripsi menjadi '${path.basename(encryptedFilePath)}'`
    );
    await logToFile(`Berhasil mengenkripsi file ${filePath}`);
  } catch (error) {
    if ((error as Error).message === "File tidak ditemukan") {
      await logToFile(
        `Error ketika mengenkripsi file: ${(error as Error).message}`
      );
    } else {
      await logToFile(
        `Error ketika mengenkripsi file: ${(error as Error).message}`
      );
    }
    await logToFile(
      `Error ketika mengenkripsi file: ${(error as Error).message}`
    );
    console.error("Error saat mengenkripsi file:", (error as Error).message);
  }
};

const decryptFile = async (filePath: string, password: string) => {
  try {
    await logToFile(`Mulai mendekripsi file ${filePath}`);

    const fileData = await fs.readFile(filePath);
    const iv = fileData.slice(0, 16); // IV berada di bagian pertama file
    const encryptedData = fileData.slice(16);
    const key = generateKey(password);

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted: Buffer;
    try {
      decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);
    } catch (error) {
      throw new Error("Password yang dimasukkan salah");
    }

    const decryptedFilePath = path.join(path.dirname(filePath), "test.txt");
    await fs.writeFile(decryptedFilePath, decrypted);

    // Hapus file yang telah dienkripsi
    await fs.unlink(filePath);

    console.log(
      `File '${path.basename(filePath)}' berhasil didekripsi menjadi 'test.txt'`
    );
    await logToFile(`Berhasil mendekripsi file ${filePath}`);
  } catch (error) {
    await logToFile(
      `Error ketika mendekripsi file: ${(error as Error).message}`
    );
    console.error(`Error: ${(error as Error).message}`);
  }
};

// Fungsi untuk memproses input terminal
const processCommand = async () => {
  const [command, filePath, password] = process.argv.slice(2);

  if (!command || !filePath || !password) {
    console.error(
      "Usage: ts-node index.ts <encrypt|decrypt> <filePath> <password>"
    );
    await logToFile("Error: Argumen tidak lengkap");
    process.exit(1);
  }

  try {
    if (command === "encrypt") {
      await encryptFile(filePath, password);
    } else if (command === "decrypt") {
      await decryptFile(filePath, password);
    } else {
      console.error(
        'Command tidak dikenali. Gunakan "encrypt" atau "decrypt".'
      );
      await logToFile(`Error: Command "${command}" tidak dikenali`);
      process.exit(1);
    }
  } catch (error) {
    await logToFile(
      `Error saat memproses command: ${(error as Error).message}`
    );
    console.error(`Error: ${(error as Error).message}`);
  }
};

// Menjalankan fungsi utama
processCommand();
