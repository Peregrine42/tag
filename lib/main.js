import m from "mithril"
import _ from "lodash"

let Node = {
  base: "http://localhost:3000/dashboards",
  current_query: m.prop(["internal_network"]),
  current_filter: m.prop(["56li22"]),
  list: () => {
    return m.request(
      {method: "GET", url: Node.build_url()}
    )
  },
  params: () => {
    let query_string = "/"+Node.current_query().join("+")
    let filter_string =
      "/" + Node.current_filter().join("/")
    return `${query_string}${filter_string}`
  },
  build_url: () => {
    return `${Node.base}${Node.params()}.json`
  }
}

let NodeForm = {
  controller: () => {
    let nodes = Node.list()
    return {
      nodes: nodes
    }
  },
  hash_as_array: (hash) => {
    let keys = Object.keys(hash);
    let values = keys.map((v, i) => {
      return { position: keys[i], name: hash[v] } ;
    });
    return values
  },
  occurances: (array) => {
    return _.groupBy(array, (item) => {
      return array.filter(
        (possible_item) => {
          return item.name === possible_item.name
        }
      ).length
    })
  },
  filtered: (ctrl) => {
    return _
      .flattenDeep(
        ctrl.nodes().nodes.map((node) => {
          let tags = NodeForm.hash_as_array(node.tags)
          return tags
            .filter((tag) => {
              return !Node.current_query()
                .includes(tag.name)
            })
            .filter((tag) => {
              return !Node.current_filter()
                .includes(tag.name)
            })
      })
    )
  },
  view: (ctrl) => {
    let tags = NodeForm.filtered(ctrl)
    let frequency = NodeForm.occurances(tags)
    let all_tags = _.keys(frequency)
      .map((key) => {
        let tag_list = _.uniq(frequency[key], (i) => {
          return i.name
        })
        let count = parseInt(key)
        return tag_list.map(
          (tag) => {
            return {
              tag: tag,
              count: count,
              css_class: count == 1 ? "unique" : "common"
            }
          }
        )
      })
    let flattened = _.flattenDeep(all_tags)
    let grouped = _.groupBy(flattened, (c_tag) => {
        return c_tag.tag.position
      })
    let grouped_values = _.values(grouped).reverse()
    let tag_ui = _.map(grouped_values, (item) => {
        return m("div", { class: "container" },
          m("div", { class: "padding" }),
          item.map((tag) => {
            return m(
              "div",
              m("input", {
                  class: "text-box " + tag.css_class,
                  value: `${tag.tag.name}`
                }
              ),
              tag.count == 1 ? [] : m("div",
                { class: "amount" },
                `${tag.count}`
              )
            )
          })
      )
    })
    return m("div", [
      m("input", { class: "title", value: Node.params() }),
      m("div", {}, tag_ui),
    ])
  }
}

m.mount(document.body, NodeForm)
