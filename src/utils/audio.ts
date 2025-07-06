var axios = require("axios")
import { Blob } from "buffer";
import JSZip from "jszip";
import { BeatmapDecoder } from 'osu-parsers'

async function fetchArchive(id) {
  const archive = axios({
		method: 'get',
		url: `https://api.nerinyan.moe/d/${id}?nh=true&nsb=true&nv=true`,
		responseType: 'arraybuffer'
	})
		.then(async (res : any) => {
      //console.log(res.length)
      //console.log(typeof res.data)
      //console.log(res.data)
      return res.data
    })
    .catch(async (err: any) => {
      return false
    })
    return archive
}

function ableToExtract() {
    
}

async function extractAudio(bmId) {
    const arhbuffer = await fetchArchive(bmId)
    //var arh = new zip.ZipReader(new zip.BlobReader(new Blob([new Uint8Array(arhbuffer)])))
    /*var files = (await arh.getEntries({ filenameEncoding: 'cp437' }))
    var osuList = []
    
    for (const file of files) {
      console.log(file.filename)
      if (file.filename.endsWith(".osu")){
        osuList.push(file)
      }
    }
    var writer = new WritableStream()
    var osuFile = await osuList[0].getData(writer)
    console.log(osuFile)*/
    if (arhbuffer != false) {
    const archive = new JSZip();
    var arh = await archive.loadAsync(arhbuffer)
    var osuList = []
    
    arh.forEach(function (relativePath, file) { 
      if (file.name.endsWith(".osu")){
        osuList.push(file.name)
      }
    })

    var osuFile = await arh.files[osuList[0]].async('text')
    var osumeta = await parseAudioFileName(osuFile)
    return {file: arh.files[osumeta.filename].async('nodebuffer'), metadata: osumeta.metadata}
  } else {
    return {file: null, metadata: {
      title: "Beatmap Preview",
      performer: "Oki-Chan"
    }}
  }
    
  
}


async function parseAudioFileName(content) {
  const decoder = new BeatmapDecoder();
  const beatmap = decoder.decodeFromString(content, {
    parseGeneral: true,
    parseEditor: false,
    parseMetadata: true,
    parseDifficulty: false,
    parseEvents: false,
    parseTimingPoints: false,
    parseHitObjects: false,
    parseStoryboard: false,
    parseColours: false,
  });
  return {filename: beatmap.general.audioFilename, metadata: {title: beatmap.metadata.titleUnicode, performer: beatmap.metadata.artistUnicode}}
}

export {extractAudio}
