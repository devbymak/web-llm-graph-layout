import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"
const REPO_URL = `https://huggingface.co/mlc-ai/${MODEL_ID}`

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit" })

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status)
  }
}

const hasCommand = (command) => {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" })
  return result.status === 0
}

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true })
}

const isNonEmptyDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) return false
  const stat = fs.statSync(dirPath)
  if (!stat.isDirectory()) return false
  return fs.readdirSync(dirPath).length > 0
}

const removeDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) return
  fs.rmSync(dirPath, { recursive: true, force: true })
}

const ensureResolveMainShim = (repoDirAbs) => {
  const resolveMainDirAbs = path.join(repoDirAbs, "resolve", "main")
  ensureDir(resolveMainDirAbs)

  const rootEntries = fs.readdirSync(repoDirAbs, { withFileTypes: true })

  rootEntries.forEach(entry => {
    if (entry.name === "resolve") return
    if (!entry.isFile()) return

    const srcAbs = path.join(repoDirAbs, entry.name)
    const destAbs = path.join(resolveMainDirAbs, entry.name)

    if (fs.existsSync(destAbs)) return

    try {
      fs.linkSync(srcAbs, destAbs)
      return
    } catch {
      // fall back to symlink
    }

    try {
      fs.symlinkSync(srcAbs, destAbs)
    } catch (err) {
      console.error("[download-webllm-model] Failed to create resolve/main shim:", entry.name)
      console.error(err)
      process.exit(1)
    }
  })
}

const main = async () => {
  const outAbs = path.resolve(process.cwd(), "public", "webllm-models", MODEL_ID)

  console.log(`[download-webllm-model] modelId: ${MODEL_ID}`)
  console.log(`[download-webllm-model] repoUrl: ${REPO_URL}`)
  console.log(`[download-webllm-model] outDir:  ${outAbs}`)

  if (!hasCommand("git")) {
    console.error("[download-webllm-model] Missing dependency: git")
    process.exit(1)
  }

  if (!hasCommand("git-lfs")) {
    console.error("[download-webllm-model] Missing dependency: git-lfs")
    console.error("[download-webllm-model] Install Git LFS, then re-run")
    process.exit(1)
  }

  if (isNonEmptyDir(outAbs)) {
    console.log("[download-webllm-model] Model already downloaded, skipping")
    return
  }

  ensureDir(path.dirname(outAbs))

  run("git", ["lfs", "install"])
  run("git", ["clone", REPO_URL, outAbs])
  run("git", ["-C", outAbs, "lfs", "pull"])

  removeDir(path.join(outAbs, ".git"))

  // WebLLM expects <model>/resolve/main/<files>
  ensureResolveMainShim(outAbs)

  console.log("[download-webllm-model] Model download complete")
}

main().catch(err => {
  console.error("[download-webllm-model] Failed:", err)
  process.exit(1)
})
