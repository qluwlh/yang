const util = require('util')
const fs = require('fs')
const path = require('path')
const os = require('os')
const axios = require('axios')

export const types = {
  A0: { key: 'A0', value: '初稿' },
  L0: { key: 'L0', value: '上会搞' },
  D0: { key: 'D0', value: '终稿' },
}
export const defaultFilePath = path.resolve(os.homedir(), 'Documents', 'yang')

export const awaitTime = (times = 2000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, times)
  })
}

export const downFile = async (url, bo, savePath, saveName) => {
  return axios
    .get(url, { params: { bo }, responseType: 'stream' })
    .then(async (res) => {
      const result = await createDirectory(savePath)
      if (!result) {
        console.log(`文件创建失败：${savePath}`)
      }
      const currentPath = result ? savePath : defaultFilePath
      const writer = fs.createWriteStream(path.resolve(currentPath, saveName))
      res.data.pipe(writer)
      console.log(`✅ ${saveName},  ✌️ 位置：${path.resolve(currentPath)}`)
    })
    .catch((e) => {
      console.log(`❌ ${saveName} 下载失败, 错误：${e}`)
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
  if (feedBackDataGrids && feedBackDataGrids.length > 0) {
    return feedBackDataGrids.map((item) => ({
      saveFileName: item.fileName,
      bo: {
        fileName: item.fileName,
        fileId: item.storeLocation,
      },
    }))
  }
  return []
}
const matchStoreLocationAndVersionType = (filter = undefined) => (item) => {
  const { storeLocation, versionType, fileName } = item
  if (storeLocation && versionType && fileName) {
    const fileIds = storeLocation.split(',')
    const fileTypes = versionType.split(',')
    const files = fileTypes
      .map((type, index) => ({
        type,
        typeName: types[type].value,
        bo: { fileId: fileIds[index], fileName },
        saveFileName: `${types[type].value}-${fileName}}`,
      }))
      .filter((item) => !filter || filter(item))
    return { ...item, files }
  }
  return { ...item, files: [] }
}
export async function handlePublicViewDataGrids(instNo, projTrackNo) {
  const publicViewDataGrids = await listPublicViewDataGrid(instNo, projTrackNo)
  if (publicViewDataGrids && publicViewDataGrids.length > 0) {
    return {
      prospectus: publicViewDataGrids
        .filter(({ fileName }) => /募集说明书/.test(fileName))
        .map(matchStoreLocationAndVersionType(({ type }) => [types.A0.key, types.D0.key].includes(type))),
      registrationStatements: publicViewDataGrids
        .filter(({ fileName }) => /注册报告/.test(fileName))
        .map(matchStoreLocationAndVersionType()),
    }
  }
  return {
    registrationStatements: [],
    prospectus: [],
  }
}
