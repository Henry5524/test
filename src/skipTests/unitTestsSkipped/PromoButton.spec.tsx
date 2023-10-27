import { mount } from 'cypress-react-unit-test';
import React from 'react';
import {PromoButton} from '../../components/controls';

describe('PromoButton tests', () => {

    it.skip('Button can be clicked and mouse hovered over', () => {
        const onClick = cy.stub().as('clicker');
        // @ts-ignore
        mount(<PromoButton click={onClick} />);
        cy.get('button').trigger('mouseover');
        cy.get('button').click();
    });

    it.skip('Button should have a class and the text property should be empty', () => {
        mount(<PromoButton
            // style={style}
            // disabled={true}
            variant = 'contained'
            disableRipple={false}
        >
            Virtana
        </PromoButton>);

        cy.get('button').should('have.class', 'MuiButton-root')
            .contains('Virtana');
    });

    it.skip('Change the default style of the button and verify the properties', function () {
        const style = {
            backgroundImage: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            borderRadius: 70,
            border: 0,
            color: 'white',
            width: 150,
            height: 48,
            position: 'absolute',
            left: '50%',
            padding: '0 30px',
        };

        mount(<PromoButton
            // @ts-ignore
            style={style}
            >
            Test
        </PromoButton>);

        const verifyStyle = 'background-image: linear-gradient(45deg, rgb(254, 107, 139) 30%, rgb(255, 142, 83) 90%); border-radius: 70px; border: 0px; color: white; width: 150px; height: 48px; position: absolute; left: 50%; padding: 0px 30px;';
        cy.get('button')
            .should('have.css', 'height', '48px')
            .should('have.css', 'background-image', 'linear-gradient(45deg, rgb(254, 107, 139) 30%, rgb(255, 142, 83) 90%)')
            .should('not.have.css', 'display', 'none');

        cy.get('button').then((response) => {
            expect(response[0].attributes[3].value).to.eq(verifyStyle)
            // console.log(response)
        });

    });

    // it.only("Pixel Compare", () => {
    //     mount(<Signin />)
    //     cy.get('form button')
    //         .then((result) => {
    //             (cy as any).xPixelCompare(result, 'PromoButton.png')
    //     })
    //     // expect(true).be.eq(true)
    //
    // })
});
