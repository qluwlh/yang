const util = require('util')
const fs = require('fs')
const axios = require('axios')
export const access = util.promisify(fs.access)
export const mkdir = util.promisify(fs.mkdir)

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
        return response.data
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
        return response.data
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
