import type { Register } from 'claude-code'

// Rows that carry the person's own words: typed at the terminal, or sent
// from the person's Remote Control client (phone/web). Task notifications,
// peer/channel/plugin messages keep the engine's own drawing.
const OWN_WORDS = new Set(['composer', 'bridge'])

export const register: Register = on => {
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    if (!OWN_WORDS.has(e.props.origin.kind)) {
      return next(e)
    }

    // The interactive transcript arrives with isExpanded = false and is
    // where the card belongs. true names the faithful views (ctrl+o full
    // transcript, --verbose, exports): pass those through untouched so the
    // stored record stays verbatim.
    if (e.props.isExpanded) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    // Display only: e.props.text is never rewritten, so the stored
    // transcript and what the model reads stay exactly as typed.
    return (
      <Box
        key="card"
        width="100%"
        borderStyle="round"
        borderColor="#60a5fa"
        backgroundColor="#1e40af"
        paddingX={1}
        gap={1}
      >
        <Text color="#bfdbfe" weight="bold">
          ❯
        </Text>
        <Box flexGrow={1}>
          <Text color="#ffffff" wrap="wrap">
            {e.props.text}
          </Text>
        </Box>
      </Box>
    )
  })
}
