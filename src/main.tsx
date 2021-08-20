interface IPSHeader {
    bundleID: string
    app_version: string
    build_version: string
    os_version: string
}

interface IPSThreadFrame {
    imageIndex: number
    imageOffset: number
}

interface IPSImage {
    base: number
    path: string
    name: string
}

interface IPSBody {
    asi: {[key: string]: string[]}
    usedImages: IPSImage[]
    faultingThread: number
    lastExceptionBacktrace: IPSThreadFrame[]
    threads: {
        frames: IPSThreadFrame[],
        name?: string,
        queue?: string
    }[]
}

const FramesTable: React.FC<{images: IPSImage[], frames: IPSThreadFrame[]}> = ({images, frames}) => {
    return <table>
        {...frames.map((trace, i) => {
            const image = images[trace.imageIndex]
            return <tr>
                <td style={{textAlign: "right"}}>{i}</td>
                <td>{image.name}</td>
                <td style={{fontFamily:"monospace"}}>
                    0x{(image.base + trace.imageOffset).toString(16)}
                    {` `}
                    (0x{image.base.toString(16)} + 0x{trace.imageOffset.toString(16)})
                </td>
            </tr>
        })}
    </table>
}

const App: React.FC<{header: IPSHeader, body: IPSBody}> = ({header, body}) => {
    const faultThread = body.threads[body.faultingThread]
    return <div>
        <div>
            {...Object.entries(body.asi).filter(a => a[1].length).flatMap(a => a[1].map(b => `${a[0]}: ${b}`))}
        </div>
        <h2>Environment:</h2>
        <div>
            App: <span style={{fontFamily: "monospace"}}>{header.bundleID}</span> v{header.app_version} ({header.build_version})
        </div>
        <div>
            OS: {header.os_version}
        </div>
        <h2>Faulting Thread ({body.faultingThread}, {faultThread.name ?? "(Untitled)"}, {faultThread.queue}) Backtrace:</h2>
        <FramesTable images={body.usedImages} frames={body.lastExceptionBacktrace}/>
        <h2>Other Threads Backtraces:</h2>
        {...body.threads.map((thread, i) => {
            return <>
                <h3>{i}: {thread.name ?? "(Untitled)"}, {thread.queue}</h3>
                <FramesTable images={body.usedImages} frames={thread.frames} />
            </>
        })}
    </div>
}

document.getElementById("load")!.addEventListener("click", async () => {
    const fileSelector = document.getElementById("file") as HTMLInputElement
    const file = fileSelector.files?.item(0)
    if (file == null) return alert("please select file")
    if (!file.name.endsWith(".ips")) return alert("not ips")
    const ab = await file.arrayBuffer()
    const text = new TextDecoder().decode(ab)
    const a = text.indexOf("\n")
    const header = JSON.parse(text.slice(0, a))
    const body = JSON.parse(text.slice(a))
    console.log(header, body)
    // const table = document.createElement("table")
    // for (const [i, trace] of body.lastExceptionBacktrace.entries()) {
    //     const line = document.createElement("tr")
    //     const id = document.createElement("td")
    //     id.style.textAlign = "right"
    //     id.textContent = i.toString()
    //     line.appendChild(id)
    //     const lib = document.createElement("td")
    //     const image = body.usedImages[trace.imageIndex]
    //     lib.textContent = image.name
    //     line.appendChild(lib)
    //     const addr = document.createElement("td")
    //     addr.textContent = `0x${(image.base + trace.imageOffset).toString(16)} (0x${image.base.toString(16)} + 0x${trace.imageOffset.toString(16)})`
    //     addr.style.fontFamily = "monospace"
    //     line.appendChild(addr)
    //     table.appendChild(line)
    // }
    // document.body.appendChild(table)
    ReactDOM.render(<App header={header} body={body} />, document.getElementById("app"))
})