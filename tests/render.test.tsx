import { expect, test } from 'claude-code/testing'

const PLUGIN = 'user-message-card'
const PROMPT = '帮我创建一个 mod — hello'

const mountMessage = (
  $: any,
  surface: 'terminal' | 'desktop',
  props: Record<string, unknown>,
  requestId: string,
) =>
  $.ui.mount({
    plugin: PLUGIN,
    surface,
    component: 'UserMessage',
    requestId,
    props,
  })

// Stands in for the engine's own drawing beneath the plugin: anything the
// hook passes through (next(e)) ends up as this Text.
const stubEngine = (on: any, label: string) => {
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine:{label}</Text>
  })
}

const expectCard = async (ui: any) => {
  const card = await ui.find({ key: 'card' })
  expect(card).toBeDefined()
  expect((await ui.find({ type: 'Text', text: new RegExp(PROMPT) }))?.text).toBe(PROMPT)
  expect(await ui.find({ type: 'Text', text: /engine:/ })).toBeUndefined()
}

const expectPassthrough = async (ui: any, label: string) => {
  expect(await ui.find({ key: 'card' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: new RegExp(`engine:${label}`) })).toBeDefined()
}

// Contract: the interactive transcript draws UserMessage with isExpanded
// = false; the card belongs there. ctrl+o / --verbose / exports raise
// isExpanded = true and must keep the engine's faithful drawing.

for (const surface of ['terminal', 'desktop'] as const) {
  for (const kind of ['composer', 'bridge'] as const) {
    test(`${kind} prompt draws the card in the everyday view on ${surface}`, async ($, on) => {
      stubEngine(on, kind)
      const ui = await mountMessage(
        $,
        surface,
        { text: PROMPT, origin: { kind }, isExpanded: false },
        `${kind}-${surface}`,
      )
      await expectCard(ui)
      await ui.unmount()
    })

    test(`${kind} prompt passes through in the faithful transcript view on ${surface}`, async ($, on) => {
      stubEngine(on, `faithful-${kind}`)
      const ui = await mountMessage(
        $,
        surface,
        { text: PROMPT, origin: { kind }, isExpanded: true },
        `faithful-${kind}-${surface}`,
      )
      await expectPassthrough(ui, `faithful-${kind}`)
      await ui.unmount()
    })
  }

  for (const isExpanded of [false, true] as const) {
    test(`task notifications pass through (expanded=${isExpanded}) on ${surface}`, async ($, on) => {
      const label = `task-${isExpanded}`
      stubEngine(on, label)
      const ui = await mountMessage(
        $,
        surface,
        { text: PROMPT, origin: { kind: 'task-notification' }, isExpanded },
        `${label}-${surface}`,
      )
      await expectPassthrough(ui, label)
      await ui.unmount()
    })
  }
}
