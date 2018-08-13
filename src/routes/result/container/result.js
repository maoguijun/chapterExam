/*
 * @Author: Mao Guijun
 * @Date: 2018-07-18 11:30:06
 * @Last Modified by: Mao Guijun
 * @Last Modified time: 2018-08-10 16:20:32
 */
import React, { PureComponent } from 'react'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { pathJump } from '../../../utils/'
import {
  titles as _tit,
  resultStatus,
  result_tableResult as _result,
  resultReplyStatus,
  rootPath,
  tableAll
} from '../../../config'
import Immutable from 'immutable'
import { fetchResult } from '../modules/result'
import { NavBar, Icon, Steps, WingBlank, WhiteSpace, Toast, Modal, Button } from 'antd-mobile'
import { Progress } from 'antd'
import '../../../../node_modules/antd/lib/progress/style/index'
import './result_.scss'
import { login } from '../../Login/modules/login'
import { encryptAes, encryptSha256, formatSecondToMinute, toFixed } from '../../../utils/common'
// import ResultList from './components/resultlist'
import { postMessage } from '../../../utils/onmessage'
const Step = Steps.Step
const alert = Modal.alert

class Result extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      currentStep: 3,
      result: Immutable.fromJS({})
    }
  }

  // WARNING! To be deprecated in React v17. Use componentDidMount instead.
  componentWillMount () {
    const result = JSON.parse(localStorage.getItem('testresult') || null)
    const chapterInfo = JSON.parse(localStorage.getItem('chapterInfo') || null)
    console.log(result, chapterInfo)
    if (result) {
      this.setState({
        result: Immutable.fromJS(result),
        chapterInfo: Immutable.fromJS(chapterInfo)
      })
    } else {
      throw new Error('没有获取到考试结果！')
    }
  }
  /** 点击item */
  onItemChange = obj => {
    let { selectList } = this.state
    const {
      intl: { formatMessage }
    } = this.props

    // 如果selectlist 里已经有了则删掉，否则添加
    console.log(68, selectList.some(item => obj.id === item.id))
    if (selectList.some(item => obj.id === item.id)) {
      selectList = selectList.filter(item => item.id !== obj.id)
    } else {
      // 判断是否已经有三个了
      if (selectList.length > 2) {
        setTimeout(
          () => alert(formatMessage({ id: 'resultAlertmessage' }), '', [{ text: formatMessage({ id: 'Iget' }) }]),
          100
        )
      } else {
        selectList.push(obj)
      }
    }
    this.setState({
      selectList
    })
  }
  backToApp = () => {
    const {
      intl: { formatMessage }
    } = this.props
    postMessage()
  }
  renderfield = () => {
    const { result } = this.state
    const {
      location: { locale }
    } = this.props
    const result_ = result.toJS()
    return (
      result_.arr &&
      result_.arr.map((item, index, array) => {
        let style = {}
        if (index !== 0) {
          style = {
            borderLeft: '1px solid #ccc'
          }
        }
        style = {
          ...style,
          width: `${parseInt(100 / array.length)}%`
        }
        console.log(123, style)
        return (
          <div className='fielditem' style={style} key={item.id}>
            <div className='rate'>
              <i>{item.correctRate}</i>
              <span>%</span>
            </div>
            <div className='fieldname'>
              {item.interestField && (locale === 'en' ? item.interestField.name_en : item.interestField.name_zh)}
            </div>
          </div>
        )
      })
    )
  }
  getPingjia = (persent = 0) => {
    const {
      intl: { formatMessage }
    } = this.props
    console.log(persent)
    if (persent < 60) {
      return 'failed'
    }
    if (persent >= 60 && persent < 90) {
      return 'good'
    }
    if (persent >= 90) {
      return 'excellent'
    }
  }
  testAgain = () => {
    const { dispatch } = this.props
    localStorage.clear()
    dispatch(pathJump(rootPath.question))
  }
  seeTest = () => {
    const { dispatch } = this.props
    dispatch(pathJump(rootPath.question))
  }
  render () {
    const {
      intl: { formatMessage, locale },
      location: { pathname },
      count
    } = this.props
    let { currentStep, result, chapterInfo } = this.state

    return (
      <div className='resultfile'>
        <NavBar
          mode='light'
          icon={<Icon onClick={() => console.log('back')} type='left' />}
          leftContent={<span>{formatMessage({ id: 'backToApp' })}</span>}
          onLeftClick={() => {
            this.backToApp()
          }}
        >
          <span>{formatMessage({ id: 'resultTitle' })}</span>
        </NavBar>
        <div className={'dashboarddiv ' + this.getPingjia(result.get('allCorrectRate'))}>
          <Progress
            type='circle'
            format={persent => {
              return (
                <div className='scoredash'>
                  <div>
                    <span className='score'>{persent}</span>
                    <span>{formatMessage({ id: 'score' })}</span>
                  </div>
                  <div>
                    <span>{formatMessage({ id: this.getPingjia(result.get('allCorrectRate')) })}</span>
                  </div>
                </div>
              )
            }}
            percent={result.get('allCorrectRate')}
            gapDegree={90}
            gapPosition='bottom'
            strokeWidth={6}
            width={150}
          />
          <div className='chapterName'>
            <div>
              <div />
            </div>
            <div>{locale === 'en' ? chapterInfo.get('name_en') : chapterInfo.get('name_zh')}</div>
            <div>
              <div />
            </div>
          </div>
        </div>
        <div className='container'>
          <div className='correctanderror'>
            <div>
              <i className='iconfont correct'>&#xe744;</i>
              <span>{formatMessage({ id: 'text_correct' })}</span>
              <span>{toFixed(result.get('correctsize'), 2)}</span>
            </div>
            <div>|</div>
            <div>
              <i className='iconfont error'>&#xe7ca;</i>
              <span>{formatMessage({ id: 'text_error' })}</span>
              <span>{toFixed(result.get('errorsize'), 2)}</span>
            </div>
          </div>
          <div className='introduction'>
            <p>{formatMessage({ id: 'testintroduction1' })}</p>
          </div>
        </div>
        <div className={'bottomButton nofull'}>
          <a className='seeAllTest' onClick={this.seeTest}>
            {formatMessage({ id: 'seeAllTest' })}
          </a>
          <Button
            type='primary'
            onClick={() => {
              this.testAgain()
            }}
          >
            {formatMessage({ id: 'testagain' })}
          </Button>
        </div>
      </div>
    )
  }
}

Result.propTypes = {
  pathJump: React.PropTypes.func
}

const mapStateToProps = state => {
  console.log(state && state.toJS())
  return {}
}
// const mapDispatchToProps = dispatch => {
//   console.log(dispatch)
//   return {
//     ...bindActionCreators(actionCreators, dispatch)
//   }
// }

export default injectIntl(
  connect(
    mapStateToProps
    // mapDispatchToProps
  )(Result)
)
