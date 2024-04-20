import axios from "axios";
import Ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";
import { createWriteStream } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { removeFile } from "./utils.js";

// dirname - это функция, которая принимает путь к файлу в качестве аргумента и возвращает путь к каталогу этого файла. Например, если у вас есть путь /home/user/documents/file.txt, dirname вернет /home/user/documents.
// resolve - это функция, которая принимает последовательность путей и объединяет их в один абсолютный путь. Например, resolve('/home/user', 'documents', 'file.txt') вернет /home/user/documents/file.txt.
// импорт функции fileURLToPath из модуля url. Эта функция преобразует URL в путь к файлу. Например, если у вас есть URL file:///home/user/documents/file.txt, fileURLToPath вернет /home/user/documents/file.txt.

const __dirname = dirname(fileURLToPath(import.meta.url));
// const __dirname = dirname(fileURLToPath(import.meta.url)); - Здесь вы определяете константу __dirname, которая будет содержать путь к каталогу текущего модуля. import.meta.url содержит URL текущего модуля. fileURLToPath(import.meta.url) преобразует этот URL в путь к файлу, а dirname(fileURLToPath(import.meta.url)) возвращает путь к каталогу этого файла.

class OggConverter {
  constructor() {
    Ffmpeg.setFfmpegPath(installer.path);
  }

  toMp3(input, output) {
    try {
      const outputPath = resolve(dirname(input), `${output}.mp3`);
      return new Promise((res, rej) => {
        Ffmpeg(input)
          .inputOption("-t 30")
          .output(outputPath)
          .on("end", () => {
            removeFile(input);
            res(outputPath);
          })
          .on("error", (err) => rej(err.message))
          .run();
      });
    } catch (e) {
      console.log("Error while creating mp3", e.message);
    }
  } // конверт ogg на mp3

  async create(url, filename) {
    try {
      const oggPath = resolve(__dirname, "../voices", `${filename}.ogg`);
      // В строке const oggPath = resolve(__dirname, "../voices", ${filename}.ogg); используется функция resolve для создания пути к ogg-файлу. __dirname - это путь к каталогу текущего модуля, "../voices" указывает на каталог voices, который находится на уровень выше текущего каталога, а

      const response = await axios({
        method: "get",
        url,
        responseType: "stream",
      });
      return new Promise((res) => {
        const stream = createWriteStream(oggPath);
        response.data.pipe(stream);
        stream.on("finish", () => res(oggPath));
      });
    } catch (e) {
      console.log("Error while creating ogg", e.message);
    }
  } // создать ogg файл из ссылки
}

export const ogg = new OggConverter();

// зачем так усложнять если в oggPath можно просто прописать путь: "const oggPath = `../voices/${filename}.ogg`"?
/* Ваш подход с использованием строки "../voices/${filename}.ogg" действительно работает в большинстве случаев, особенно когда вы знаете, что ваш код всегда будет запускаться из определенного места в файловой системе. Однако использование resolve из модуля path обеспечивает большую гибкость и надежность.

Вот некоторые причины, по которым может быть полезно использовать resolve:

Портабельность: Пути к файлам могут отличаться в разных операционных системах. Например, Windows использует обратные слеши (\), а Unix-подобные системы используют прямые слеши (/). Функция resolve автоматически учитывает эти различия, делая ваш код более портабельным.
Абсолютные пути: resolve возвращает абсолютный путь, что может быть полезно, если ваш код перемещается по файловой системе. Относительные пути, такие как "../voices/${filename}.ogg", будут интерпретироваться относительно текущего рабочего каталога, который может измениться. Абсолютные пути всегда указывают на одно и то же место, независимо от текущего рабочего каталога.
Удобство: resolve позволяет легко объединять пути, не беспокоясь о добавлении или удалении слешей. Если вы просто склеиваете строки, вам нужно убедиться, что слеши правильно расставлены.
В общем, использование resolve делает ваш код более надежным и универсальным, хотя это и добавляет немного сложности. */
