const util = require('util')
const fs = require('fs')
const axios = require('axios')
export const access = util.promisify(fs.access)
export const mkdir = util.promisify(fs.mkdir)

export const types = {
  A0: { key: 'A0', value: '初稿' },
  L0: { key: 'L0', value: '上会搞' },
  D0: { key: 'D0', value: '终稿' },
}

export const awaitTime = (times = 2000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, times)
  })
}

export const downFile = (url, filePath, fileName, fileId) => {
  return axios
    .get(url, { params: { bo: { fileName, fileId } }, responseType: 'stream' })
    .then((res) => {
      const writer = fs.createWriteStream(path.resolve(filePath, fileName))
      res.data.pipe(writer)
      console.log(`✅ ${fileName},  ✌️ 位置：${path.resolve(filePath)}`)
    })
    .catch((e) => {
      console.log(`❌ ${fileName} 下载失败, 错误：${e}`)
    })
}

export const createDirectory = (filePath) =>
  new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        fs.mkdir(filePath, { recursive: true }, (err) => {
          if (err) {
            console.log(`创建失败`)
            reject(err)
          } else {
            resolve(true)
          }
        })
      } else {
        resolve(true)
      }
    })
  })

export const getData = (pageNo, pageSize) =>
  axios
    .get('http://zhuce.nafmii.org.cn/fans/publicQuery/releFileProjDataGrid', {
      params: {
        page: pageNo,
        rows: pageSize,
        startTime: '2013-01-01',
        endTime: '2019-12-31',
      },
    })
    .then((response) => {
      if (response.status === 200) {
        return response.data
      } else {
        throw new Error('接口获取失败')
      }
    })
    .then(({ rows }) => {
      return rows
    })

export const handleData = (rows) => {
  return rows
    .filter(({ regNoticeNo }) => /\[[1-9]\d{3}\](CP|SCP|MTN|DFI)\d+/.test(regNoticeNo))
    .map(({ instNo, regFileName, regNoticeNo, releaseTime, projTrackNo }) => ({
      instNo,
      regFileName,
      releaseTime,
      projTrackNo,
      regNoticeNo,
    }))
}

//反馈意见及回复
export const listFeedBackGrid = (instNo, projTrackNo) => {
  return axios
    .get('http://zhuce.nafmii.org.cn/fans/publicQuery/feedBackGrid', {
      params: {
        instNo,
        projTrackNo,
      },
    })
    .then((response) => {
      if (response.status === 200 && response.data && response.data.rows) {
        return { rows: response.data.rows }
      } else {
        console.log(`反馈意见及回复接口data获取失败--instNo: ${instNo},projTrackNo: ${projTrackNo}`)
        return { rows: [] }
      }
    })
    .then(({ rows }) => {
      return rows
    })
    .catch((error) => {
      console.log(`error 反馈意见及回复接口调用：${error}`)
      return []
    })
}

//公开披露文件
export const listPublicViewDataGrid = (instNo, projTrackNo) => {
  return axios
    .get('http://zhuce.nafmii.org.cn/fans/publicQuery/publicViewDataGrid', {
      params: {
        instNo,
        projTrackNo,
      },
    })
    .then((response) => {
      if (response.status === 200 && response.data && response.data.rows) {
        return { rows: response.data.rows }
      } else {
        console.log(`公开披露文件data获取失败--instNo: ${instNo},projTrackNo: ${projTrackNo}`)
        return { rows: [] }
      }
    })
    .then(({ rows }) => {
      return rows
    })
    .catch((error) => {
      console.log(`error:公开披露文件接口调用失败 ${error}`)
      return []
    })
}

const params = {
  page: 1,
  rows: 1,
  startTime: '2013-01-01',
  endTime: '2019-12-31',
}

export const getInitData = async () => {
  const response = await axios.get('http://zhuce.nafmii.org.cn/fans/publicQuery/releFileProjDataGrid', { params })
  if (!response || response.status !== 200) {
    throw new Error('接口获取失败')
  } else {
    return response.data
  }
}

export async function handleFeedBackDataGrids(instNo, projTrackNo) {
  const feedBackDataGrids = await listFeedBackGrid(instNo, projTrackNo)
  const result = {}
  if (feedBackDataGrids && feedBackDataGrids.length > 0) {
    const [inquiryLetter, replyLetter] = feedBackDataGrids
    if (inquiryLetter) {
      result.inquiryLetter = JSON.stringify({
        url: 'http://zhuce.nafmii.org.cn/file_web/file/download',
        opt: { params: { bo: { fileName: inquiryLetter.fileName, fileId: inquiryLetter.storeLocation } } },
      })
    }
    if (replyLetter) {
      result.replyLetter = JSON.stringify({
        url: 'http://zhuce.nafmii.org.cn/file_web/file/download',
        opt: { params: { bo: { fileName: inquiryLetter.fileName, fileId: inquiryLetter.storeLocation } } },
      })
    }
  }
  return result
}

export async function handlePublicViewDataGrids(instNo, projTrackNo) {
  const publicViewDataGrids = await listPublicViewDataGrid(instNo, projTrackNo)
  const result = {}
  if (publicViewDataGrids && publicViewDataGrids.length > 0) {
    const prospectus = publicViewDataGrids.filter(({ fileName }) => /募集说明书/.test(fileName))
    if (prospectus && prospectus.length > 0) {
      for (const item of prospectus) {
        const { storeLocation, fileName, versionType } = item
        if (storeLocation) {
          const fileIds = storeLocation.split(',')
          const fileTypes = versionType.split(',')
          const files = fileTypes.map((item, index) => ({ type: item, fileId: fileIds[index] }))
          const firstDraft = files.find((item) => item.type === types.A0.key)
          const finalDraft = files.find((item) => item.type === types.D0.key)
          if (firstDraft) {
            result.firstDraft = JSON.stringify({
              url: 'http://zhuce.nafmii.org.cn/file_web/file/download',
              opt: { params: { bo: { fileName, fileId: firstDraft.fileId } } },
            })
          }
          if (finalDraft) {
            result.finalDraft = JSON.stringify({
              url: 'http://zhuce.nafmii.org.cn/file_web/file/download',
              opt: { params: { bo: { fileName, fileId: finalDraft.fileId } } },
            })
          }
        }
        //  await downFile('http://zhuce.nafmii.org.cn/file_web/file/download',filePath,fileName,fileIds[0])
      }
    }
    const registrationStatement = publicViewDataGrids.filter(({ fileName }) => /注册报告/.test(fileName))
  }
  return result
}
