// @flow
import * as React from 'react'
import PropTypes from 'prop-types'
import type { Source } from './MulticastProvider'

type Props<Args> = {
  name: string,
  source: Source,
  children: (...args: Args) => React.Node,
}
type State<Args: $ReadOnlyArray<*>> = { args: Args | null }

export default class Multicast<Args: $ReadOnlyArray<*>> extends React.Component<
  Props<Args>,
  State<Args>,
> {
  unsubscribe: void | (() => void)
  state: State<Args>

  constructor(props) {
    super(props)
    this.state = { args: null }
  }

  componentDidMount() {
    // eslint-disable-next-line no-unused-vars
    const { name, source, children } = this.props
    const props = Object.assign({}, this.props)
    delete props.name
    delete props.source
    delete props.children

    const listener = args => this.setState({ args })
    this.unsubscribe = this.context.multicast.subscribe({
      name,
      source,
      listener,
      props,
    })
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe()
  }

  render() {
    return this.state.args ? this.props.children(...this.state.args) : null
  }
}

Multicast.contextTypes = {
  multicast: PropTypes.object.isRequired,
}
