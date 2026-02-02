/**
 * @file 自动生成 Qt 资源文件 (.qrc)
 * @description 扫描 dist 目录，生成对应的 web_resources.qrc 文件
 */

import { readdirSync, statSync, writeFileSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** 项目根目录 */
const PROJECT_ROOT = join(__dirname, '../../..')

/** dist 目录 */
const DIST_DIR = join(__dirname, '../dist')

/** 输出的 qrc 文件路径 */
const QRC_OUTPUT = join(PROJECT_ROOT, 'web_resources.qrc')

/**
 * 递归扫描目录，获取所有文件
 * @param {string} dir - 目录路径
 * @param {string[]} files - 文件列表
 * @returns {string[]} 文件路径列表
 */
function scanDirectory(dir, files = []) {
  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      scanDirectory(fullPath, files)
    } else {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * 生成 qrc 文件内容
 * @param {string[]} files - 文件路径列表
 * @returns {string} qrc 文件内容
 */
function generateQrcContent(files) {
  const lines = [
    '<RCC>',
    '    <qresource prefix="/web">'
  ]

  for (const file of files) {
    // 相对于项目根目录的路径
    const relativePath = relative(PROJECT_ROOT, file).replace(/\\/g, '/')
    // 相对于 dist 目录的路径（用作 alias）
    const alias = relative(DIST_DIR, file).replace(/\\/g, '/')

    lines.push(`        <file alias="${alias}">${relativePath}</file>`)
  }

  lines.push('    </qresource>')
  lines.push('</RCC>')
  lines.push('')

  return lines.join('\n')
}

/**
 * 主函数
 */
function main() {
  // 检查 dist 目录是否存在
  if (!existsSync(DIST_DIR)) {
    console.error('错误: dist 目录不存在，请先运行 npm run build')
    process.exit(1)
  }

  console.log('扫描 dist 目录...')
  const files = scanDirectory(DIST_DIR)

  console.log(`找到 ${files.length} 个文件`)

  const content = generateQrcContent(files)
  writeFileSync(QRC_OUTPUT, content, 'utf-8')

  console.log(`已生成: ${QRC_OUTPUT}`)
}

main()
