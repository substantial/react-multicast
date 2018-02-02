// @flow
// flowlint unclear-type:warn
import * as React from 'react'
import PropTypes from 'prop-types'

type Props = {
  children: React.Node,
}

type Listener = (...args: $ReadOnlyArray<mixed>) => void

export type Source = (args: { children: Function, key: string }) => React.Node

type Instance = {
  name: string,
  source: Source,
  props: {},
  listeners: $ReadOnlyArray<Listener>,
  args: $ReadOnlyArray<mixed>,
}

type State = {
  instances: { [name: string]: Instance },
}

type SubscribeArgs = {
  name: string,
  source: Source,
  props: {},
  listener: Listener,
}

class MulticastChild extends React.Component<*> {
  componentDidMount() {
    this.props.listeners.forEach(listener => listener(this.props.args))
  }

  componentDidUpdate() {
    this.props.listeners.forEach(listener => listener(this.props.args))
  }

  render() {
    return null
  }
}

export default class MulticastProvider extends React.Component<Props, State> {
  constructor(props) {
    super(props)
    this.state = { instances: {} }

    this.subscribe = (args: SubscribeArgs) => {
      const { name, source, props, listener } = args
      this.setState(({ instances }) => {
        if (!instances[name]) {
          const instance = {
            name,
            source,
            props,
            listeners: [listener],
          }
          const newInstances = Object.assign({}, instances, { [name]: instance })

          return { instances: newInstances }
        }
        const instance = instances[name]
        return {
          instances: Object.assign({}, {
            [name]: Object.assign({}, {
              listeners: [...instance.listeners, listener],
            }),
          }),
        }
      })

      return () =>
        this.setState(({ instances }) => {
          const instance = instances[name]
          if (!instance) return {}

          let { listeners } = instance
          listeners = listeners.filter(l => l !== listener)

          if (listeners.length) {
            return {
              instances: Object.assign({}, instances, { [name]: Object.assign({}, instance, { listeners }) }),
            }
          }

          const newInstances = Object.assign({}, instances)
          delete newInstances[name]

          return { instances: newInstances }
        })
    }
  }

  getChildContext() {
    return {
      multicast: { subscribe: this.subscribe },
    }
  }

  renderSources() {
    return Object.keys(this.state.instances).map(name => {
      if (!this.state.instances[name]) return null

      const { source, listeners, props } = this.state.instances[name]
      const children = (...args) => (
        <MulticastChild listeners={listeners} args={args} />
      )

      return source(Object.assign({ children, key: name }, props))
    })
  }

  render() {
    return (
      <React.Fragment>
        {this.renderSources()}
        {this.props.children}
      </React.Fragment>
    )
  }
}

MulticastProvider.childContextTypes = {
  multicast: PropTypes.object.isRequired,
}
