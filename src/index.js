import Excel from 'exceljs'
import moment from 'moment'
import os from 'os'
import path from 'path'
import { awaitTime, createDirectory, getData, getInitData, handleData, listFeedBackGrid, listPublicViewDataGrid } from './util'
const filePath = path.resolve(os.homedir(), 'Documents', 'yang')

const excelFilename = `${filePath}/demo-${moment().format('YYYY-MM-DD_HH:mm')}.xlsx`

const types = {
  A0: '初稿',
  L0: '上会搞',
  D0: '终稿',
}

const options = {
  filename: excelFilename,
  useStyles: false,
  useSharedStrings: true,
}
const columns = [
  { header: 'instNo', key: 'instNo', width: 20 },
  { header: '债券名称', key: 'regFileName', width: 60 },
  { header: '更新日期', key: 'releaseTime', width: 30 },
  { header: 'projTrackNo', key: 'projTrackNo', width: 40 },
  { header: '注册通知书文号', key: 'regNoticeNo', width: 30 },
  { header: '初稿', key: 'firstDraft', width: 30 },
  { header: '终稿', key: 'finalDraft', width: 30 },
  { header: '注册报告', key: 'registrationStatement', width: 30 },
  { header: '问询函', key: 'inquiryLetter', width: 30 },
  { header: '回函', key: 'replyLetter', width: 30 },
]
const run = async () => {
  const initData = await getInitData()
  const { total } = initData
  const result = await createDirectory(filePath)
  if (!result) {
    throw new Error(`文件创建失败：${filePath}`)
  }
  const pageSize = 20
  const pageCount = Math.ceil(total / pageSize)
  const workbook = new Excel.stream.xlsx.WorkbookWriter(options)
  const worksheet = workbook.addWorksheet('First')
  worksheet.columns = columns
  for (let index = 0; index < 1; index++) {
    await awaitTime(1000)
    const rows = await getData(index + 1, pageSize)
    const data = handleData(rows)
    for (const currentData of data) {
      const row = currentData
      const publicViewDataGrids = await listPublicViewDataGrid(currentData.instNo, currentData.projTrackNo)
      if (publicViewDataGrids && publicViewDataGrids.length > 0) {
        const prospectus = publicViewDataGrids.filter(({ fileName }) => /募集说明书/.test(fileName))
        if (prospectus && prospectus.length > 0) {
          for (const item of prospectus) {
            const { storeLocation, fileName, versionType } = item
            if (storeLocation) {
              const fileIds = storeLocation.split(',')
              const fileTypes = versionType.split(',')
              const files = fileTypes.map((item, index) => ({ type: item, fileId: fileIds[index] }))
              const firstDraft = files.find((item) => item.type === types.A0)
              const finalDraft = files.find((item) => item.type === types.D0)
              if (firstDraft) {
                row.firstDraft = JSON.stringify({
                  url: 'http://zhuce.nafmii.org.cn/file_web/file/download',
                  opt: { params: { bo: { fileName, fileId: firstDraft.fileId } } },
                })
              }
              if (finalDraft) {
                row.finalDraft = JSON.stringify({
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
      const feedBackDataGrids = await listFeedBackGrid(currentData.instNo, currentData.projTrackNo)
      if (feedBackDataGrids && feedBackDataGrids.length > 0) {
        const [inquiryLetter, replyLetter] = feedBackDataGrids
        if (inquiryLetter) {
          row.inquiryLetter = JSON.stringify({
            url: 'http://zhuce.nafmii.org.cn/file_web/file/download',
            opt: { params: { bo: { fileName: inquiryLetter.fileName, fileId: inquiryLetter.storeLocation } } },
          })
        }
        if (replyLetter) {
          row.replyLetter = JSON.stringify({
            url: 'http://zhuce.nafmii.org.cn/file_web/file/download',
            opt: { params: { bo: { fileName: replyLetter.fileName, fileId: replyLetter.storeLocation } } },
          })
        }
      }
      worksheet.addRow(row).commit()
    }
  }
  worksheet.commit()
  const res = await workbook.commit()
}
run()
  .then(() => {
    console.log('success')
  })
  .catch(console.log)

// const currentPath = path.resolve(os.homedir(),'Documents','yang')
// createDirectory(currentPath).then(console.log).catch(console.log)
