import type { Transaction } from '@tiptap/pm/state'
import type { GlobalAttributes } from '@tiptap/vue-3'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { combineTransactionSteps, Extension, findChildrenInRange, getChangedRanges } from '@tiptap/vue-3'

export const symbol = Extension.create({
  name: 'symbol',
  addGlobalAttributes() {
    const attrs: GlobalAttributes = []

    attrs.push(...(this.extensions.filter(ext => ext.name !== 'text').map(ext => ({
      types: [ext.name],
      attributes: {
        type: {
          default: ext.type,
          renderHTML(attributes) {
            return {
              'data-type': attributes.type,
            }
          },
          parseHTML(element) {
            return element.getAttribute('data-type')
          },
        },
        nodeName: {
          default: ext.name,
          renderHTML(attributes) {
            return {
              'data-node-name': attributes.nodeName,
            }
          },
          parseHTML(element) {
            return element.getAttribute('data-node-name')
          },
        },
      },
    })) as GlobalAttributes))

    return attrs
  },
  addProseMirrorPlugins() {
    const key = new PluginKey(this.name)

    return [
      new Plugin({
        key,
        appendTransaction(trs, { doc: oldDoc }, { doc: newDoc, tr }) {
          if (!trs.find(tr => tr.docChanged) || newDoc.eq(oldDoc)) {
            return
          }

          const transform = combineTransactionSteps(oldDoc, trs as Transaction[])
          getChangedRanges(transform).forEach(({ newRange }) => {
            const newNodes = findChildrenInRange(newDoc, newRange, node => !node.isText)

            newNodes.forEach(({ node, pos }) => {
              // fix error inherit
              tr.setNodeAttribute(pos, 'type', node.type.spec.attrs?.type?.default)
              tr.setNodeAttribute(pos, 'nodeName', node.type.spec.attrs?.nodeName?.default)
            })
          })

          return tr
        },
      }),
    ]
  },
})
