/**
 * MIT License
 *
 * Copyright (c) 2018 Click to Cloud Pty Ltd
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 **/
const AST = require('../../ast');
const getValue = require('../../valueProvider');
const Typings = require('../../typings');

const Val = {
    accept: ({ current, parent, }) => {
        const accepted =
            (current.node === 'FieldDeclaration' ||
            current.node === 'VariableDeclarationStatement') &&
            getValue(current.type) === 'val';
        return accepted;
    },

    run: ({ current, parent, root, config, }) => {
        const fragment = current.fragments[0];
        if(!fragment) {
            throw new Error('Incomplete variable declaration for val');
        }
        const initializer = fragment.initializer;
        const typeStr = Typings.checkType(initializer, config);
        if(!typeStr) {
            throw new Error(`Cannot infer variable type for "${getValue(fragment.name)}" in : ${getValue(initializer)}`);
        }
        const type = AST.parseType(typeStr);

        if(!AST.hasModifier(current.modifiers, 'final')) {
            AST.appendChild(current, 'modifiers', {
                node: "Modifier",
                keyword: "final"
            });
        }

        AST.setChild(current, 'type', type);
        AST.refreshScopes(current);
    },
};

module.exports = Val;
