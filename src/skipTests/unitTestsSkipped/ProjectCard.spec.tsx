import { mount } from 'cypress-react-unit-test';
import React from 'react';
import {ProjectCard} from "../../components/controls";
// @ts-ignore
import { Project } from '../../components/specs/data/projectCard.json'

describe('ProjectCard tests', () => {

    //TODO : Need to do investigate further
    it.skip('Mount the ProjectCard', function () {
        mount(<ProjectCard projectData={Project}/>)
    });

});
