import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';

import './src/api.js';
import './src/events.js';
import { initPaydaySystem } from './src/functions.js';

const Rebar = useRebar();

initPaydaySystem();
