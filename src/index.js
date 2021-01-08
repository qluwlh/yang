import Excel from 'exceljs'
import moment from 'moment'
import os from 'os'
import path from 'path'
import { awaitTime, createDirectory, getData, getInitData, handleData, handleFeedBackDataGrids, handlePublicViewDataGrids } from './util'

const filePath = path.resolve(os.homedir(), 'Documents', 'yang')
const excelFilename = `${filePath}/demo-${moment().format('YYYY-MM-DD_HH:mm')}.xlsx`

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
  console.log(`共${pageCount}页`)
  const workbook = new Excel.stream.xlsx.WorkbookWriter(options)
  const worksheet = workbook.addWorksheet('First')
  worksheet.columns = columns
  for (let index = 0; index < 1; index++) {
    console.log(`当前第${index + 1}页：${moment().format('YYYY-MM-DD__HH-mm-SS')}`)
    await awaitTime(1000)
    const rows = await getData(index + 1, pageSize)
    const data = handleData(rows)
    data && data.length > 0 && console.log('<---------page.data.length: ', data.length)
    for (const currentData of data) {
      const row = currentData
      const { firstDraft = '', finalDraft = '' } = await handlePublicViewDataGrids(currentData.instNo, currentData.projTrackNo)
      row.firstDraft = firstDraft
      row.finalDraft = finalDraft
      const { inquiryLetter = '', replyLetter = '' } = await handleFeedBackDataGrids(currentData.instNo, currentData.projTrackNo)
      row.inquiryLetter = inquiryLetter
      row.replyLetter = replyLetter
      worksheet.addRow(row).commit()
    }
  }
  worksheet.commit()
  await workbook.commit()
}
run()
  .then(() => {
    console.log('success')
  })
  .catch(console.log)
