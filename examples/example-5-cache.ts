import { PojoConstructorAsync } from '../src';
import axios from 'axios';

type AppCfg = {
  remote_fetched_option: string;
  derived_option_1: string;
  derived_option_2: string;
};

let remoteCalls = 0;

const appCfgCtor = new PojoConstructorAsync<AppCfg>({
  /**
   * Emulates fetching feature flags from database or a CMS.
   */
  async remote_fetched_option() {
    const GET_0_OR_1 = `https://www.random.org/integers/?num=1&min=0&max=1&col=1&base=2&format=plain&rnd=id.${Date.now()}`;
    const value = (await axios.get(GET_0_OR_1)).data;
    remoteCalls++;
    return {
      value: 'remote_fetched_option : ' + value,
    };
  },

  async derived_option_1(_, { cache }) {
    return {
      value:
        'derived_option_1 / ' + (await cache.remote_fetched_option()).value,
    };
  },

  async derived_option_2(_, { cache }) {
    return {
      value: 'derived_option_2 / ' + (await cache.derived_option_1()).value,
    };
  },
});

(async () => {
  const cfg = await appCfgCtor.new();
  console.log(cfg);
  console.log({ remoteCalls });
})();
