import TransitionItems, { TransitionItem } from '../Transition/TransitionItems';

describe('TransitionItems', () => {
  describe('add', () => {
    it('returns new instance if not exists', () => {
      const items = new TransitionItems();
      const item = new TransitionItem();
      const newItems = items.add(item);
      expect(items).not.toBe(newItems);
    })
    it('returns same instance if already exists', () => {
      const item = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const items = new TransitionItems([item]);
      const newItems = items.add(item);
      expect(items).toBe(newItems);
    })
    it('adds many items', () => {
      let items = new TransitionItems();
      const n = 50;
      for (let i = 0; i < n; i++) {
        items = items.add(new TransitionItem({id: `item${i}`, routeName: 'route1'}));
      }
      expect(items.count()).toBe(n);
    })
  })
  describe('remove', () => {
    it('returns new instance if found an item to remove', () => {
      const item = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const items = new TransitionItems([item]);
      const newItems = items.remove(item.id, item.routeName);
      expect(items).not.toBe(newItems);
    });
    it('returns same instance if item not found', () => {
      const item = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const items = new TransitionItems([item]);
      const newItems = items.remove({id: 'sharedView2', routeName: 'route'});
      expect(items).toBe(newItems);
    });
    it('removes item properly', () => {
      const item = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const items = new TransitionItems([item]);
      const newItems = items.remove(item.id, item.routeName);
      expect(newItems._items.length).toBe(0);
    })
  })
  describe('updateMetrics', () => {
    it('returns new instance if found an item to update', () => {
      const item = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const items = new TransitionItems([item]);
      const { id, routeName } = item;
      const newItems = items.updateMetrics([{ id, routeName, metrics: { x: 1, y: 2 } }]);
      expect(items).not.toBe(newItems);
    });
    it('returns same instance if item not found', () => {
      const item = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const items = new TransitionItems([item]);
      const newItems = items.updateMetrics([{ id: 'blah', routeName: item.routeName, metrics: { x: 1, y: 2 } }]);
      expect(items).toBe(newItems);
    });
    it('update item properly', () => {
      const item = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const items = new TransitionItems([item]);
      const metrics = { x: 1, y: 2 };
      const { id, routeName } = item;
      const newItems = items.updateMetrics([{ id, routeName, metrics }]);
      expect(newItems._items[0].metrics).toBe(metrics);
    })
    it('update multiple items', () => {
      const item1 = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const item2 = new TransitionItem({id: 'sharedView2', routeName: 'route'});
      const items = new TransitionItems([item1, item2]);
      const metrics = { x: 1, y: 2 };
      const requests = [
        { id: item1.id, routeName: item1.routeName, metrics },
        { id: item2.id, routeName: item2.routeName, metrics },
      ]
      const newItems = items.updateMetrics(requests);
      expect(newItems._items[0].metrics).toBe(metrics);
      expect(newItems._items[1].metrics).toBe(metrics);
    })
    it('does not update items not in requests', () => {
      const item1 = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const item2 = new TransitionItem({id: 'sharedView2', routeName: 'route'});
      const items = new TransitionItems([item1, item2]);
      const metrics = { x: 1, y: 2 };
      const requests = [
        { id: item1.id, routeName: item1.routeName, metrics },
      ]
      const newItems = items.updateMetrics(requests);
      expect(newItems._items.filter(i => i.metrics).length).toBe(1);
    })
    it('remove metrics', () => {
      const metrics = { x: 1, y: 2 };
      const item1 = new TransitionItem({id: 'sharedView', routeName: 'route', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const item2 = new TransitionItem({id: 'sharedView2', routeName: 'route', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const items = new TransitionItems([item1, item2]);
      const requests = [
        { id: item1.id, routeName: item1.routeName, metrics: null },
        { id: item2.id, routeName: item2.routeName, metrics: null },
      ]
      const newItems = items.updateMetrics(requests);
      expect(newItems._items[0].metrics).toBeNull();
      expect(newItems._items[1].metrics).toBeNull();
    })
  })
  describe('removeAllMetrics', () => {
    it('returns new instance if some items has metrics', () => {
      const metrics = { x: 1, y: 2 };
      const item = new TransitionItem({id: 'sharedView', routeName: 'route', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const items = new TransitionItems([item]);
      const newItems = items.removeAllMetrics();
      expect(items).not.toBe(newItems);
    });
    it('returns same instance if none of items have metrics', () => {
      const item = new TransitionItem({id: 'sharedView', routeName: 'route'});
      const items = new TransitionItems([item]);
      const newItems = items.removeAllMetrics();
      expect(items).toBe(newItems);
    });
    it('update item properly', () => {
      const metrics = { x: 1, y: 2 };
      const item = new TransitionItem({id: 'sharedView', routeName: 'route', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const items = new TransitionItems([item]);
      const newItems = items.removeAllMetrics();
      expect(newItems._items[0].metrics).toBeNull;
    })
  });
  describe('areAllMeasured', () => {
    it('returns true if all items contain metrics', () => {
      const metrics = { x: 1, y: 2, width: 3, height: 4 };
      const item1 = new TransitionItem({id: 'shared1', routeName: 'route1', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const item2 = new TransitionItem({id: 'shared1', routeName: 'route2', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const item3 = new TransitionItem({id: 'shared2', routeName: 'route1', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const item4 = new TransitionItem({id: 'shared2', routeName: 'route2', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const items = new TransitionItems([item1, item2, item3, item4]);
      expect(items.areAllMeasured()).toBe(true);
    });
    it('returns false if some item should be measured but does not contain metrics', () => {
      const metrics = { x: 1, y: 2, width: 3, height: 4 };
      const item1 = new TransitionItem({id: 'shared1', routeName: 'route1', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const item2 = new TransitionItem({id: 'shared1', routeName: 'route2', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics: null, shouldMeasure: true});
      const item3 = new TransitionItem({id: 'shared2', routeName: 'route1', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const item4 = new TransitionItem({id: 'shared2', routeName: 'route2', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const items = new TransitionItems([item1, item2, item3, item4]);
      expect(items.areAllMeasured()).toBe(false);
    });
    it('returns true if all "shouldMeasure" items contain metrics', () => {
      const metrics = { x: 1, y: 2, width: 3, height: 4 };
      const item1 = new TransitionItem({id: 'shared1', routeName: 'route1', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const item2 = new TransitionItem({id: 'shared1', routeName: 'route2', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics: null, shouldMeasure: false});
      const item3 = new TransitionItem({id: 'shared2', routeName: 'route3', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const item4 = new TransitionItem({id: 'shared2', routeName: 'route4', reactElement: 'reactElement', nativeHandle: 'nativeHandle', metrics});
      const items = new TransitionItems([item1, item2, item3, item4]);
      expect(items.areAllMeasured()).toBe(true);
    });
    it('returns true for empty items', () => {
      const items = new TransitionItems();
      expect(items.areAllMeasured()).toBe(true);
    })
  })
})

describe('TransitionItem', () => {
  it('clone', () => {
    const item = new TransitionItem({id: 'blah', routeName: 'momo', transitionType: 'sharedElement'});
    const cloned = item.clone();
    expect(cloned.id).toBe(item.id);
    expect(cloned.routeName).toBe(item.routeName);
    expect(cloned.transitionType).toBe(item.transitionType);
  })
})

