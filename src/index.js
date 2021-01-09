import Excel from 'exceljs'
import moment from 'moment'
import os from 'os'
import path from 'path'
import { createDirectory, downFile, getData, getInitData, handleData, handleFeedBackDataGrids, handlePublicViewDataGrids } from './util'

const allowDownloadFile = true

const filePath = path.resolve(os.homedir(), 'Documents', 'yang-files')
const excelFilename = `${filePath}/${moment().format(`MM月DD日_HH'mm'SS'`)}.xlsx`

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
  { header: '募集说明', key: 'prospectus', width: 30 },
  { header: '注册报告', key: 'registrationStatements', width: 30 },
  { header: '函', key: 'letter', width: 30 },
]
const run = async () => {
  const initData = await getInitData()
  const { total } = initData
  const result = await createDirectory(filePath)
  if (!result) {
    throw new Error(`文件创建失败：${filePath}`)
  }
  const pageSize = 200
  const pageCount = Math.ceil(total / pageSize)
  console.log(`共${pageCount}页，每页${pageSize}条数据`)
  const workbook = new Excel.stream.xlsx.WorkbookWriter(options)
  const worksheet = workbook.addWorksheet('First')
  worksheet.columns = columns
  for (let index = 0; index < pageCount; index++) {
    console.log(`当前第${index + 1}页：${moment().format(`MM月DD日_HH'mm'SS'`)}`)
    const rows = await getData(index + 1, pageSize)
    const data = handleData(rows)
    console.log('<---------page.data.length: ', data && data.length)
    for (const currentData of data) {
      const row = currentData
      const downloadUrl = 'http://zhuce.nafmii.org.cn/file_web/file/download'
      const downloadPath = `${filePath}/files/${currentData.instNo}`
      const { prospectus, registrationStatements } = await handlePublicViewDataGrids(currentData.instNo, currentData.projTrackNo)
      row.prospectus = JSON.stringify(prospectus)
      row.registrationStatements = JSON.stringify(registrationStatements)
      allowDownloadFile &&
        (await Promise.allSettled(
          [...prospectus, ...registrationStatements]
            .map(({ files }) => files)
            .flatMap((item) => item)
            .map((file) => downFile(downloadUrl, file.bo, downloadPath, file.saveFileName))
        ))
      const letters = await handleFeedBackDataGrids(currentData.instNo, currentData.projTrackNo)
      row.letter = JSON.stringify(letters)
      allowDownloadFile &&
        (await Promise.allSettled(letters.map((file) => downFile(downloadUrl, file.bo, downloadPath, file.saveFileName))))
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
